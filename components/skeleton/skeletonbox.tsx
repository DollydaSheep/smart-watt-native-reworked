import React, { memo } from "react";
import { Skeleton } from "moti/skeleton";
import { DimensionValue, useColorScheme } from "react-native";

export type SkeletonBoxProps = {
  width?: DimensionValue;
  height: number;
};

const SkeletonBox = ({ width = "100%", height }: SkeletonBoxProps) => {
  const colorScheme = useColorScheme();
  const colorMode = colorScheme === "dark" ? "dark" : "light";

  return (
    <Skeleton
      colorMode={colorMode}
      width={width} // Percentage, number, or 'auto'
      height={height} // Number (e.g., fontSize)
    />
  );
};

export default memo(SkeletonBox);