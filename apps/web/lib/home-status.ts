import { productStatus } from "./landing";

import preview from "../../../dev-preview.json";

/** The one public status the home says (« paused » while the product is), read from dev-preview.json. */
export const homeStatus = () => productStatus(preview);
