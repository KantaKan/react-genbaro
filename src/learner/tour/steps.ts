import type { CheckinRules } from "../types";

export interface TourStep {
  target: string;
  title: string;
  body: string;
}

const clock = ({ h, m }: { h: number; m: number }) => `${h}:${String(m).padStart(2, "0")}`;

export function tourSteps(rules: CheckinRules): TourStep[] {
  return [
    { target: "checkin", title: "เช็คชื่อทุกเช้าและบ่าย", body: `เลื่อนปุ่มไปทางขวาเพื่อเช็คชื่อ ก่อน ${clock(rules.morning.late_after)} นับว่าตรงเวลา หลังจากนั้นนับว่าสาย ช่วงบ่ายจะเปิดให้เช็คอีกรอบ` },
    { target: "week", title: "ดูสัปดาห์นี้", body: "แต่ละวันมีเช้า (AM) กับบ่าย (PM) สีเขียวคือมาตรงเวลา สีเหลืองคือสาย" },
    { target: "reflection", title: "เขียน reflection ทุกวัน จ-ศ", body: "เปิดให้เขียนตอน 16:30 เลือกว่าวันนี้อยู่โซนไหน แล้วเขียนเป็น journal การเรียนของวันนี้ ได้เรียนอะไร ติดตรงไหน รู้สึกยังไง" },
    { target: "plant", title: "ต้นไม้โตตาม streak", body: "เขียน reflection ติดกันทุกวันเรียน ต้นไม้จะโตขึ้น เสาร์อาทิตย์ไม่นับ ไม่ต้องห่วง" },
    { target: "leave", title: "ลาหรือจะมาสาย แจ้งตรงนี้", body: "ขาด ลา และสาย นับรวมกันได้ไม่เกิน 8 วันทั้งคอร์ส กด Request leave เพื่อแจ้ง TA" },
    { target: "nav", title: "เมนูอื่นๆ", body: "ตารางเรียน ประวัติการเข้าเรียน คุยกับเพื่อนใน Talk Board และสวนของรุ่นอยู่ตรงนี้" },
  ];
}
