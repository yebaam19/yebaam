import { useId, type SVGProps } from "react";

type YebaamLogoProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

export function YebaamLogo({ title = "Yebaam", ...props }: YebaamLogoProps) {
  const titleId = useId();

  return (
    <svg
      viewBox="0 0 360 92"
      role={title ? "img" : undefined}
      aria-labelledby={title ? titleId : undefined}
      aria-hidden={title ? undefined : true}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <g fill="currentColor">
        <path d="M219.7 24.5c11.7-5.1 25.9-3.7 36.6 3.8 2.9 2 5.1 4.3 6.6 6.6 9.7 1.1 16.5 4.8 16.5 9.2 0 5.4-10.2 9.8-22.8 9.8-2.9 0-5.6-.2-8.1-.7-9.9 3.9-22.1 3.7-31.9-.6-2.4.4-4.9.6-7.5.6-12.6 0-22.8-4.4-22.8-9.8 0-4.4 6.8-8.1 16.4-9.2 3.5-4.1 9.1-7.6 17-9.7Zm-9.4 9.8c14.3 7.1 31.2 7.4 45.7.9-1.2-1.5-2.9-3-5.1-4.3-8.3-5.2-19.5-6.1-28.8-2.2-5 2.1-8.9 4-11.8 5.6Zm-3.8 4.4c-6.5.4-11.2 2.3-11.2 4.7 0 2.8 6.4 5 14.3 5h.5a33 33 0 0 1-3.6-9.7Zm46.7 10c7.8-.1 14.1-2.3 14.1-5 0-2.4-4.7-4.4-11.2-4.8a35.2 35.2 0 0 1-2.9 9.8Zm-39.9-9a27.4 27.4 0 0 0 33.8.3 82.6 82.6 0 0 1-33.8-.3Z" />
        <path d="M216 56.5h35l-9.3 25.2a31 31 0 0 0-14.2-6.4 32 32 0 0 0-18.6 2l7.1-20.8ZM265.6 18.3l4.3 1.7 1.7 4.3 1.7-4.3 4.3-1.7-4.3-1.7-1.7-4.3-1.7 4.3-4.3 1.7ZM198.6 48.5a4.4 4.4 0 1 0 0-8.8 4.4 4.4 0 0 0 0 8.8ZM221.6 56.6a4.4 4.4 0 1 0 0-8.8 4.4 4.4 0 0 0 0 8.8ZM245.6 56.6a4.4 4.4 0 1 0 0-8.8 4.4 4.4 0 0 0 0 8.8ZM270 48.5a4.4 4.4 0 1 0 0-8.8 4.4 4.4 0 0 0 0 8.8Z" />
      </g>
      <text
        x="0"
        y="70"
        fill="currentColor"
        fontFamily="Poppins, Myriad Pro, Arial, sans-serif"
        fontSize="74"
        fontWeight="900"
        letterSpacing="0"
      >
        Yebaam
      </text>
    </svg>
  );
}
