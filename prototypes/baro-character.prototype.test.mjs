import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { JSDOM, VirtualConsole } from "jsdom";

const html = readFileSync(new URL("./baro-character.prototype.html", import.meta.url), "utf8");

function createPage() {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", error => errors.push(error));
  const page = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/", virtualConsole });
  const { document } = page.window;
  const click = selector => document.querySelector(selector).click();
  return { page, document, click, errors };
}

test("reveal keeps the same character and lets it be pinned independently", () => {
  const { page, document, click, errors } = createPage();
  click("#reveal");
  const serial = document.querySelector("#card-serial").textContent;
  assert.match(serial, /^B-/);
  click("#reveal");
  assert.equal(document.querySelector("#card-serial").textContent, serial);
  document.querySelector("#showcase-message").value = "วันนี้เก่งมาก";
  click("#pin-showcase");
  assert.match(document.querySelector("#showcase-grid").textContent, /วันนี้เก่งมาก/);
  click("#change-outfit");
  assert.match(document.querySelector("#showcase-grid").textContent, /วันนี้เก่งมาก/);
  assert.deepEqual(errors, []);
  page.window.close();
});

test("unopened boxes transfer and never give an owned item twice", () => {
  const { page, document, click, errors } = createPage();
  click("#reveal");
  click("#grant-box");
  assert.match(document.querySelector("#gift-card").textContent, /GIFT-001/);
  click("#transfer-box");
  assert.match(document.querySelector("#gift-status").textContent, /learner-002/);
  document.querySelector("#learner-id").value = "learner-002";
  click("#reveal");
  click("#open-box");
  assert.match(document.querySelector("#gift-status").textContent, /ไม่ซ้ำ/);
  const firstPrize = document.querySelector("#collection-list").textContent;
  for (let index = 0; index < 12; index++) {
    click("#grant-box");
    click("#open-box");
  }
  const prizes = [...document.querySelectorAll("#collection-list span")].map(item => item.textContent);
  assert.equal(prizes.length, new Set(prizes).size);
  assert.equal(prizes.length, 10);
  assert.match(document.querySelector("#gift-status").textContent, /เก็บกล่องไว้หรือส่งต่อ/);
  assert.ok(document.querySelector("#gift-card").textContent.includes("GIFT-"));
  assert.ok(document.querySelector("#collection-list").textContent.includes(firstPrize));
  assert.deepEqual(errors, []);
  page.window.close();
});

test("GOD events are replayable and reactions toggle", () => {
  const { page, document, click, errors } = createPage();
  click("#reveal");
  click("#showcase-demo");
  const reaction = document.querySelector('[data-react="minty"]');
  reaction.click();
  assert.match(document.querySelector('[data-react="minty"]').textContent, /1/);
  document.querySelector('[data-react="minty"]').click();
  assert.match(document.querySelector('[data-react="minty"]').textContent, /0/);
  document.querySelector("#god-message").value = "ทุกคนเก่งมาก";
  click("#cast-god");
  assert.match(document.querySelector("#god-caption").textContent, /ทุกคนเก่งมาก/);
  assert.equal(document.querySelectorAll("#god-history button").length, 1);
  assert.deepEqual(errors, []);
  page.window.close();
});
