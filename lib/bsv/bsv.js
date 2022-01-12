import { Buffer } from "../buffer.js";
window.Buffer = Buffer

if (!window.bsvjs) {
  throw new Error(
    "Please import 'bsv.bundle.js' at the beginning of the html document"
  );
}

export default window.bsvjs
