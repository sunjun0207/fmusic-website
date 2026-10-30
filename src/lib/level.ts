const STEPS = [0, 10, 30, 60, 100, 200, 400, 700, 1000, 1500]
const TITLES = ['聆听新人', '旋律旅人', '节拍玩家', '宝藏猎人', '声波达人', '乐迷先锋', '律动大师', '聆听主理人', '声音收藏家', '传奇乐迷']

/** 按累计播放次数算的听歌等级，只存在本机。 */
export function listenLevel(count: number) {
  let index = 0
  STEPS.forEach((need, step) => {
    if (count >= need) index = step
  })
  const floor = STEPS[index] ?? 0
  const next = STEPS[index + 1]
  return {
    level: index + 1,
    title: TITLES[index] ?? '',
    next,
    progress: next === undefined ? 1 : (count - floor) / (next - floor),
  }
}
