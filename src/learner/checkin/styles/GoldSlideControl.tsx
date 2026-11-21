import { SlideControl } from "../SlideControl";
import type { CheckInControlProps } from "../types";

export default function GoldSlideControl(p: CheckInControlProps) {
  return <SlideControl {...p} skin="gold" />;
}
