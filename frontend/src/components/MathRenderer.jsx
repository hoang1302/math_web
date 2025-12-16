import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MathRenderer = ({ content }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Handle empty or missing content
    if (!content || !content.trim()) {
      containerRef.current.innerHTML = '<p class="text-gray-500 italic">Nội dung đang được cập nhật...</p>';
      return;
    }

    // Replace LaTeX delimiters
    let html = content;
    
    // Replace block math $$...$$
    html = html.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), { displayMode: true });
      } catch (e) {
        return match;
      }
    });

    // Replace inline math $...$
    html = html.replace(/\$([^$]+)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), { displayMode: false });
      } catch (e) {
        return match;
      }
    });

    // Replace \frac{a}{b} patterns
    html = html.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => {
      try {
        return katex.renderToString(`\\frac{${num}}{${den}}`, { displayMode: false });
      } catch (e) {
        return match;
      }
    });

    // Replace line breaks
    html = html.replace(/\n/g, '<br />');

    containerRef.current.innerHTML = html;
  }, [content]);

  return <div ref={containerRef} className="math-content" />;
};

export default MathRenderer;

