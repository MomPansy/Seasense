import { HTMLAttributes, ReactNode, CSSProperties } from "react";

type SpacingValue =
  | "0"
  | "px"
  | "0.5"
  | "1"
  | "1.5"
  | "2"
  | "2.5"
  | "3"
  | "3.5"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "14"
  | "16"
  | "20"
  | "24"
  | "28"
  | "32"
  | "36"
  | "40"
  | "44"
  | "48"
  | "52"
  | "56"
  | "60"
  | "64"
  | "72"
  | "80"
  | "96"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "8xl"
  | "9xl"
  | "auto";

type GapValue =
  | "0"
  | "px"
  | "0.5"
  | "1"
  | "1.5"
  | "2"
  | "2.5"
  | "3"
  | "3.5"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "14"
  | "16"
  | "20"
  | "24"
  | "28"
  | "32"
  | "36"
  | "40"
  | "44"
  | "48"
  | "52"
  | "56"
  | "60"
  | "64"
  | "72"
  | "80"
  | "96"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "8xl"
  | "9xl";

type StackProps = HTMLAttributes<HTMLDivElement> & {
  direction?: "row" | "column";
  gap?: GapValue;
  flex?: number;
  className?: string;
  children?: ReactNode;
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly";
  items?: "start" | "end" | "center" | "baseline" | "stretch";
  p?: SpacingValue;
  pl?: SpacingValue;
  pr?: SpacingValue;
  pt?: SpacingValue;
  pb?: SpacingValue;
  m?: SpacingValue;
  ml?: SpacingValue;
  mr?: SpacingValue;
  mt?: SpacingValue;
  mb?: SpacingValue;
};

const justifyClasses = {
  start: "justify-start",
  end: "justify-end",
  center: "justify-center",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

const itemsClasses = {
  start: "items-start",
  end: "items-end",
  center: "items-center",
  baseline: "items-baseline",
  stretch: "items-stretch",
};

// Helper to convert spacing value to Tailwind class or custom value
const getSpacingClass = (prefix: string, value?: SpacingValue): string => {
  if (!value) return "";
  // Otherwise treat as Tailwind scale
  return `${prefix}-${value}`;
};

// Helper to get custom style value
const getCustomSpacing = (value?: SpacingValue): string | undefined => {
  if (!value) return undefined;
  return undefined;
};

export function Stack({
  direction = "column",
  gap,
  flex,
  justify,
  items,
  p,
  pl,
  pr,
  pt,
  pb,
  m,
  ml,
  mr,
  mt,
  mb,
  className = "",
  children,
  ...rest
}: StackProps) {
  const justifyClass = justify ? justifyClasses[justify] : "";
  const itemsClass = items ? itemsClasses[items] : "";

  // Build Tailwind spacing classes
  const spacingClasses = [
    getSpacingClass("p", p),
    getSpacingClass("pl", pl),
    getSpacingClass("pr", pr),
    getSpacingClass("pt", pt),
    getSpacingClass("pb", pb),
    getSpacingClass("m", m),
    getSpacingClass("ml", ml),
    getSpacingClass("mr", mr),
    getSpacingClass("mt", mt),
    getSpacingClass("mb", mb),
    gap ? (getCustomSpacing(gap) ? "" : `gap-${gap}`) : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Build custom styles for non-Tailwind values
  const customStyles: CSSProperties = {
    ...(flex !== undefined ? { flex } : {}),
  };

  const customP = getCustomSpacing(p);
  const customPl = getCustomSpacing(pl);
  const customPr = getCustomSpacing(pr);
  const customPt = getCustomSpacing(pt);
  const customPb = getCustomSpacing(pb);
  const customM = getCustomSpacing(m);
  const customMl = getCustomSpacing(ml);
  const customMr = getCustomSpacing(mr);
  const customMt = getCustomSpacing(mt);
  const customMb = getCustomSpacing(mb);
  const customGap = getCustomSpacing(gap);

  if (customP) {
    customStyles.padding = customP;
  } else {
    if (customPt) customStyles.paddingTop = customPt;
    if (customPb) customStyles.paddingBottom = customPb;
    if (customPl) customStyles.paddingLeft = customPl;
    if (customPr) customStyles.paddingRight = customPr;
  }

  if (customM) {
    customStyles.margin = customM;
  } else {
    if (customMt) customStyles.marginTop = customMt;
    if (customMb) customStyles.marginBottom = customMb;
    if (customMl) customStyles.marginLeft = customMl;
    if (customMr) customStyles.marginRight = customMr;
  }

  if (customGap) {
    customStyles.gap = customGap;
  }

  return (
    <div
      className={`${direction === "row" ? "flex flex-row" : "flex flex-col"} ${spacingClasses} ${justifyClass} ${itemsClass} ${className}`}
      style={Object.keys(customStyles).length > 0 ? customStyles : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
