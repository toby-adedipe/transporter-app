import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing, borderRadius, fontFamily } from '@/constants/theme';

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; value: string; href: string };

interface MarkdownViewerProps {
  content: string;
  textColor?: string;
}

interface MarkdownBlock {
  type: 'heading' | 'paragraph' | 'bullet' | 'numbered' | 'quote' | 'code' | 'spacer';
  text?: string;
  number?: string;
}

const INLINE_PATTERN =
  /(\[[^\]]+\]\((?:https?:\/\/|mailto:)[^)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_)/g;

const tokenizeInline = (text: string): InlineToken[] => {
  const tokens: InlineToken[] = [];
  let cursor = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const value = match[0];
    const start = match.index ?? 0;

    if (start > cursor) {
      tokens.push({ type: 'text', value: text.slice(cursor, start) });
    }

    if (value.startsWith('[')) {
      const linkMatch = value.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        tokens.push({ type: 'link', value: linkMatch[1], href: linkMatch[2] });
      } else {
        tokens.push({ type: 'text', value });
      }
    } else if (
      (value.startsWith('**') && value.endsWith('**')) ||
      (value.startsWith('__') && value.endsWith('__'))
    ) {
      tokens.push({ type: 'bold', value: value.slice(2, -2) });
    } else if (value.startsWith('*') && value.endsWith('*')) {
      tokens.push({ type: 'italic', value: value.slice(1, -1) });
    } else if (value.startsWith('_') && value.endsWith('_')) {
      tokens.push({ type: 'italic', value: value.slice(1, -1) });
    } else if (value.startsWith('`') && value.endsWith('`')) {
      tokens.push({ type: 'code', value: value.slice(1, -1) });
    } else {
      tokens.push({ type: 'text', value });
    }

    cursor = start + value.length;
  }

  if (cursor < text.length) {
    tokens.push({ type: 'text', value: text.slice(cursor) });
  }

  if (tokens.length === 0) {
    return [{ type: 'text', value: text }];
  }

  return tokens;
};

const parseMarkdownBlocks = (content: string): MarkdownBlock[] => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  const codeLines: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({ type: 'code', text: codeLines.join('\n') });
        codeLines.length = 0;
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      blocks.push({ type: 'spacer' });
      continue;
    }

    const headingMatch = line.match(/^\s{0,3}#{1,6}\s+(.*)$/);
    if (headingMatch) {
      blocks.push({ type: 'heading', text: headingMatch[1] });
      continue;
    }

    const bulletMatch = line.match(/^\s*[-*+]\s+(.*)$/);
    if (bulletMatch) {
      blocks.push({ type: 'bullet', text: bulletMatch[1] });
      continue;
    }

    const numberedMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      blocks.push({ type: 'numbered', number: numberedMatch[1], text: numberedMatch[2] });
      continue;
    }

    const quoteMatch = line.match(/^\s*>\s+(.*)$/);
    if (quoteMatch) {
      blocks.push({ type: 'quote', text: quoteMatch[1] });
      continue;
    }

    blocks.push({ type: 'paragraph', text: line });
  }

  if (inCodeBlock && codeLines.length > 0) {
    blocks.push({ type: 'code', text: codeLines.join('\n') });
  }

  return blocks;
};

export function MarkdownViewer({ content, textColor = colors.textPrimary }: MarkdownViewerProps) {
  const blocks = React.useMemo(() => parseMarkdownBlocks(content), [content]);

  const renderInline = (text: string, keyPrefix: string) =>
    tokenizeInline(text).map((token, index) => {
      const key = `${keyPrefix}-${index}`;
      if (token.type === 'text') return <Text key={key}>{token.value}</Text>;
      if (token.type === 'bold') return <Text key={key} style={styles.bold}>{token.value}</Text>;
      if (token.type === 'italic') return <Text key={key} style={styles.italic}>{token.value}</Text>;
      if (token.type === 'code') return <Text key={key} style={styles.inlineCode}>{token.value}</Text>;

      return (
        <Text
          key={key}
          style={styles.link}
          onPress={() => {
            void Linking.openURL(token.href);
          }}
        >
          {token.value}
        </Text>
      );
    });

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        if (block.type === 'spacer') return <View key={`spacer-${index}`} style={styles.spacer} />;
        if (block.type === 'code') {
          return (
            <View key={`code-${index}`} style={styles.codeBlock}>
              <Text style={styles.codeText}>{block.text}</Text>
            </View>
          );
        }
        if (block.type === 'heading') {
          return (
            <Text key={`heading-${index}`} style={[styles.heading, { color: textColor }]}>
              {renderInline(block.text ?? '', `heading-${index}`)}
            </Text>
          );
        }
        if (block.type === 'bullet') {
          return (
            <View key={`bullet-${index}`} style={styles.listRow}>
              <Text style={[styles.listMarker, { color: textColor }]}>{'\u2022'}</Text>
              <Text style={[styles.blockText, { color: textColor }]}>
                {renderInline(block.text ?? '', `bullet-${index}`)}
              </Text>
            </View>
          );
        }
        if (block.type === 'numbered') {
          return (
            <View key={`number-${index}`} style={styles.listRow}>
              <Text style={[styles.listMarker, { color: textColor }]}>{`${block.number}.`}</Text>
              <Text style={[styles.blockText, { color: textColor }]}>
                {renderInline(block.text ?? '', `number-${index}`)}
              </Text>
            </View>
          );
        }
        if (block.type === 'quote') {
          return (
            <View key={`quote-${index}`} style={styles.quoteBlock}>
              <Text style={[styles.blockText, { color: textColor }]}>
                {renderInline(block.text ?? '', `quote-${index}`)}
              </Text>
            </View>
          );
        }

        return (
          <Text key={`paragraph-${index}`} style={[styles.blockText, { color: textColor }]}>
            {renderInline(block.text ?? '', `paragraph-${index}`)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  blockText: {
    fontSize: fontSize.sm,
    lineHeight: 21,
    fontFamily: fontFamily.regular,
  },
  heading: {
    fontSize: fontSize.base,
    lineHeight: 22,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.semibold,
  },
  bold: {
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
  },
  italic: {
    fontStyle: 'italic',
  },
  inlineCode: {
    fontFamily: 'Courier',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  listMarker: {
    minWidth: 16,
    fontSize: fontSize.sm,
    lineHeight: 21,
    fontWeight: fontWeight.semibold,
  },
  quoteBlock: {
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    paddingLeft: spacing.sm,
  },
  codeBlock: {
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  codeText: {
    fontFamily: 'Courier',
    fontSize: fontSize.xs,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  spacer: {
    height: spacing.xs,
  },
});

