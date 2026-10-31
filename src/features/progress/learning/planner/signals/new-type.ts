import type { Signal } from "../contracts";

export const newType: Signal = {
  name: "newType",
  score: ({ topic, type }, { learning }) => {
    const status = learning.topics.get(topic)?.status;
    return status && !status.cleanTypes.includes(type) ? 1 : 0;
  },
};
