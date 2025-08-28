import { useId } from "react";
import { getDictionaryLinks } from "../lib/dictionary-links";
import { DictionaryIcon, ExternalLinkIcon } from "./Icons";

export default function DictionaryLinksButton({
  language,
  content,
  className,
}: {
  language: string;
  content: string;
  className?: string;
}) {
  const id = useId();
  const dictionaryLinks = getDictionaryLinks(language, content);
  if (!dictionaryLinks) return null;

  // If there's only one dictionary, render a direct link button
  if (dictionaryLinks.length === 1) {
    const link = dictionaryLinks[0];
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn btn-ghost btn-square ${className}`}
        title={`Open ${link.name}`}
      >
        <img src={link.icon} className="w-5 h-5" alt={link.name} />
      </a>
    );
  }

  // If there are multiple dictionaries, render the dropdown
  return (
    <>
      <button
        id={`trigger-${id}`}
        className={`btn btn-ghost btn-square ${className}`}
        aria-controls={`popover-${id}`}
        popoverTarget={`popover-${id}`}
        style={{ anchorName: `--anchor-${id}` } as React.CSSProperties}
      >
        <DictionaryIcon />
      </button>

      <ul
        id={`popover-${id}`}
        role="menu"
        aria-labelledby={`trigger-${id}`}
        aria-orientation="vertical"
        aria-label="Dictionary links"
        aria-expanded="false"
        aria-haspopup="true"
        popover="auto"
        className="dropdown menu bg-base-100 rounded-box z-1 w-xs p-2 shadow-sm"
        style={{ anchorName: `--anchor-${id}` } as React.CSSProperties}
      >
        {dictionaryLinks?.map((link) => (
          <li key={link.name}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium flex items-center gap-1"
            >
              <img src={link.icon} className="w-4 h-4" />
              <span className="truncate flex-1">{link.name}</span>
              <ExternalLinkIcon />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
