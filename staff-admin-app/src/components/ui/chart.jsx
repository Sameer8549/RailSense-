import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

// Color palette mapped to CSS vars
const THEMES = { light: "", dark: ".dark" };

export const ChartContext = React.createContext(null);
function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be inside ChartContainer");
  return ctx;
}

export const ChartContainer = React.forwardRef(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

const ChartStyle = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(([, cfg]) => cfg.theme || cfg.color);
  if (!colorConfig.length) return null;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES).map(([theme, prefix]) =>
          `${prefix} [data-chart=${id}] { ${colorConfig
            .map(([key, itemConfig]) => {
              const color = theme === "light" ? itemConfig.theme?.light ?? itemConfig.color : itemConfig.theme?.dark ?? itemConfig.color;
              return color ? `--color-${key}: ${color};` : null;
            })
            .filter(Boolean)
            .join(" ")} }`
        ).join("\n"),
      }}
    />
  );
};

export const ChartTooltip = RechartsPrimitive.Tooltip;
export const ChartTooltipContent = React.forwardRef(({ active, payload, label, className, ...props }, ref) => {
  if (!active || !payload?.length) return null;
  return (
    <div ref={ref} className={cn("grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl", className)} {...props}>
      {label && <div className="font-medium">{label}</div>}
      <div className="grid gap-1">
        {payload.map((item, i) => (
          <div key={i} className="flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground">
            <div className="flex flex-1 justify-between leading-none items-center gap-2">
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-mono font-medium tabular-nums text-foreground">{item.value?.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
ChartTooltipContent.displayName = "ChartTooltipContent";

export const ChartLegend = RechartsPrimitive.Legend;
export const ChartLegendContent = React.forwardRef(({ className, payload }, ref) => {
  if (!payload?.length) return null;
  return (
    <div ref={ref} className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
      {payload.map((item) => (
        <div key={item.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
          {item.value}
        </div>
      ))}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegendContent";
