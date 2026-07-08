# China H5 MVP — Tester Release Checklist

## Before Sharing to Testers

- [ ] EdgeOne production URL works
- [ ] CloudBase environment is correct: `heyin-d3gr32uxw8348239a`
- [ ] Security domain configured: `heyin-rtgvltyz.edgeone.cool`
- [ ] Anonymous login enabled in CloudBase Auth
- [ ] 6 database collections exist (projects, lyric_lines, voice_slots, voice_submissions, works, work_versions)
- [ ] CloudBase Storage enabled
- [ ] At least one full test project completed end-to-end
- [ ] Mobile mic permission tested on at least one device
- [ ] Upload tested
- [ ] Export (Generate Chorus) tested
- [ ] Work page tested
- [ ] Delete project tested
- [ ] Known limitations accepted

---

## Tester Instruction (可发给测试者)

> 打开链接：
>
> **https://heyin-rtgvltyz.edgeone.cool?eo_token=...**
>
> 1. 输入你的昵称（比如"小雨"）
> 2. 点一个空的歌词槽位
> 3. 允许浏览器使用麦克风
> 4. 录一句歌词
> 5. 点 Submit 提交
> 6. 点已经填满的槽位可以听其他人的录音
>
> 就是你的声音和别人的声音合在一起！

---

## What Feedback to Collect

- [ ] 页面打开快吗？
- [ ] 麦克风权限弹出来了吗？
- [ ] 录音感觉顺手吗？
- [ ] Submit 成功了吗？
- [ ] 播放能听到声音吗？
- [ ] 有什么地方让你困惑吗？
- [ ] 用什么手机 / 浏览器？
- [ ] 用的 WiFi 还是 4G/5G？

---

## Tester Quick Checklist

| # | Test | ⬜ |
|---|---|---|
| 1 | 打开链接 | ⬜ |
| 2 | 输入昵称 | ⬜ |
| 3 | 点空槽位 | ⬜ |
| 4 | 允许麦克风 | ⬜ |
| 5 | 录音 | ⬜ |
| 6 | Submit | ⬜ |
| 7 | 听自己的录音 | ⬜ |
| 8 | 总体体验 | ⬜ |

---

## Known Issues to Tell Testers

- 这是 MVP 测试版，可能有小 bug
- 录音需要在安静环境效果更好
- 目前只支持手机浏览器，微信内打开可能有兼容问题
- 如果 Submit 失败，可以重试
- 如果页面卡住，刷新一下
