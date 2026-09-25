import { createCursorCodec, intCodec, uuidCodec } from "../../shared";

export type MenuPositionCursor = {
  position: number;
  id: string;
};

export type MenuIdCursor = {
  id: string;
};

export const menuPositionCursorCodec = createCursorCodec<MenuPositionCursor>({
  order: ["position", "id"],
  codecs: {
    position: intCodec,
    id: uuidCodec,
  },
});

export const menuIdCursorCodec = createCursorCodec<MenuIdCursor>({
  order: ["id"],
  codecs: {
    id: uuidCodec,
  },
});
