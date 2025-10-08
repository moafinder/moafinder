const palette = ['#7CB92C', '#0AA4BF', '#F0A202', '#6B3FA0', '#E5625E', '#1F6FEB', '#111827'];

export const getListColor = (index = 0) => palette[Math.abs(index) % palette.length];

export default palette;
