import Svg, {
  G,
  Path,
  Ellipse,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  Filter,
  FeFlood,
  FeColorMatrix,
  FeOffset,
  FeGaussianBlur,
  FeComposite,
  FeBlend,
} from "react-native-svg";

export default function SmartChadGreen(props: any) {
  return (
    <Svg width={382} height={279} viewBox="0 0 382 279" fill="none" {...props}>
      <Defs>
        <LinearGradient id="paint0" x1="201" y1="-10.5" x2="415" y2="319">
          <Stop offset="0" stopColor="white" />
          <Stop offset="0.26" stopColor="#32E97E" />
          <Stop offset="1" stopColor="#3A8F6A" />
        </LinearGradient>

        <LinearGradient id="paint1" x1="51" y1="176" x2="85" y2="176">
          <Stop offset="0.2" stopColor="#47EE92" />
          <Stop offset="0.96" stopColor="#288853" />
        </LinearGradient>
      </Defs>

      <G>
        <Path
          d="M396 142C396 213.245 338.245 271 267 271C195.755 271 113 206.245 113 135C119 48.5 258.755 0 330 0C401.245 0 396 70.7553 396 142Z"
          fill="url(#paint0)"
        />
      </G>

      <Ellipse cx="297" cy="64" rx="46" ry="45" fill="white" />
      <Ellipse cx="200" cy="109" rx="46" ry="45" fill="white" />

      <Circle cx="204" cy="109" r="30" fill="#595959" />
      <Circle cx="293" cy="63" r="30" fill="#595959" />

      <Path
        d="M253 144C253 144 265 153 278 144C292 134 288 124 288 124"
        stroke="#595959"
        strokeWidth={4}
        strokeLinecap="round"
      />

      <Rect
        x="51"
        y="154"
        width="25"
        height="43"
        rx="7"
        fill="url(#paint1)"
      />
    </Svg>
  );
}