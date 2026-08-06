import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { cn } from '../../lib/utils';
import 'katex/dist/katex.min.css';

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), ['className']],
    span: [...(defaultSchema.attributes?.span || []), ['className'], ['style']],
    div: [...(defaultSchema.attributes?.div || []), ['className'], ['style']],
  },
};

export default function MarkdownRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'prose prose-zinc max-w-none dark:prose-invert',
        'prose-headings:font-semibold prose-a:text-violet-600 dark:prose-a:text-violet-400',
        'prose-pre:bg-zinc-950 prose-pre:text-zinc-100',
        'prose-code:before:content-none prose-code:after:content-none',
        'prose-img:rounded-xl',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeSanitize, schema], rehypeKatex]}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}
