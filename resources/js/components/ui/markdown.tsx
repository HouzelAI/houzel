// components/markdown.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { ComponentProps } from "react";

type CodeProps = ComponentProps<"code"> & { inline?: boolean };

// Generic shape for the components map (good enough for TS without subpath types)
type MarkdownComponents = {
  [elementName: string]: React.ComponentType<any>;
};

const components: MarkdownComponents = {
  h1: (props) => <h1 className="text-xl font-semibold mt-2 mb-2" {...props} />,
  h2: (props) => <h2 className="text-lg font-semibold mt-2 mb-2" {...props} />,
  h3: (props) => <h3 className="text-base font-semibold mt-2 mb-2" {...props} />,
  p:  (props) => <p className="text-sm leading-6" {...props} />,
  ul: (props) => <ul className="list-disc pl-5 space-y-1 mb-2" {...props} />,
  ol: (props) => <ol className="list-decimal pl-5 space-y-1 mb-2" {...props} />,
  li: (props) => <li className="text-sm leading-6" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
  a:  (props) => <a className="underline hover:opacity-80" target="_blank" rel="noreferrer" {...props} />,
  hr: (props) => <hr className="my-5 h-[2px] bg-white/25" {...props} />,
  code: ({ inline, className, children, ...props }: CodeProps) =>
    inline ? (
      <code className="px-1 py-0.5 rounded bg-[#2a2a2b] text-xs" {...props}>
        {children}
      </code>
    ) : (
      <pre className="bg-[#2a2a2b] rounded-lg p-3 overflow-x-auto text-xs mb-3">
        <code className={className} {...props}>{children}</code>
      </pre>
    ),
};

export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}
