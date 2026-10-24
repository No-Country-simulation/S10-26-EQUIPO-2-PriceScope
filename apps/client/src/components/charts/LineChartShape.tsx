import * as React from "react";
import { LineDrawShape, type LineDrawShapeProps } from "recharts";
import { extendPointsToGapBoundaries } from "@/lib/dashboard/chartGapExtensions";

export interface ExtendedLineShapeProps extends LineDrawShapeProps {
  connectNulls?: boolean;
  extendEdges?: boolean;
}

/**
 * Dibuja la línea SVG extendiendo sus bordes y conectando huecos.
 */
export function ExtendedLineShape({
  points,
  connectNulls,
  extendEdges = true,
  ...rest
}: ExtendedLineShapeProps) {
  const extendedPoints = React.useMemo(
    () => extendPointsToGapBoundaries(points, connectNulls, extendEdges),
    [points, connectNulls, extendEdges]
  );

  return <LineDrawShape {...rest} connectNulls={connectNulls} points={extendedPoints} />;
}
