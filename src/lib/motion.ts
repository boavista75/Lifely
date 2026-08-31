export const tabTransition = {
  duration: 0.16,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const slideTransition = {
  duration: 0.22,
  ease: [0.32, 0.72, 0, 1] as const,
};

export const sheetSpring = {
  type: "spring" as const,
  stiffness: 520,
  damping: 42,
  mass: 0.8,
};

export const snappySpring = {
  type: "tween" as const,
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const dialogTransition = {
  duration: 0.16,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const monthSlide = {
  enter: (direction: number) => ({
    x: `${direction * 12}%`,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: `${direction * -12}%`,
    opacity: 0,
  }),
};

export const listItem = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
};
