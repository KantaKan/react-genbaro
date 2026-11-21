import {
  STAMP_W,
  STAMP_H,
  buildPerforationCircles,
  stampMaskFractions,
} from "@/lib/stamp-mask";

export function StampDefs() {
  const fractionCircles = stampMaskFractions(
    buildPerforationCircles(STAMP_W, STAMP_H),
    STAMP_W,
    STAMP_H
  );

  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <mask
          id="stamp-perf"
          maskUnits="objectBoundingBox"
          maskContentUnits="objectBoundingBox"
          x="0"
          y="0"
          width="1"
          height="1"
        >
          <rect width="1" height="1" fill="white" />
          {fractionCircles.map((circle, index) => (
            <circle key={index} cx={circle.cx} cy={circle.cy} r={circle.r} fill="black" />
          ))}
        </mask>
      </defs>
    </svg>
  );
}
