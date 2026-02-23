import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";

const worker = setupWorker();

export default worker;
