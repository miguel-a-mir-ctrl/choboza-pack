[English](../README.md) · [한국어](README.ko.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md)

# choboza-pack (초보자팩)

초보자를 위한 Claude Code 작은 모드 두 개입니다. 내 PC 안에서 돌아가는 코드입니다.

## 들어 있는 것

| 모드 | 하는 일 |
|---|---|
| **usage-line** | 입력칸 위에 한 줄: 5시간·주간 사용량, 지금 모델·effort·문맥. 윈도우에서는 CPU·RAM·GPU·NPU 사용률도 보입니다. |
| **lab-panel** | 옆 패널에 알록달록한 파일 목록. Claude 가 읽거나 고친 파일이 잠깐 빛납니다. 다시보기 탭은 방금 턴에서 고친 내용을 보여 줍니다. 메모 탭에 내 메모를 둘 수 있습니다. 윈도우에서는 그림 위에 그리는 그림판 탭도 있습니다. |

## 설치

Claude Code 에서 입력하세요:

```
/plugin marketplace add miguel-a-mir-ctrl/choboza-pack
/plugin install usage-line@choboza-pack
/plugin install lab-panel@choboza-pack
```

그다음 Claude Code 를 다시 켜세요 (또는 `/reload-plugins`). 패널은 `/panel` 로 엽니다.

## 설정

플러그인 설정(`/plugin`)에서 바꿉니다.

| 모드 | 설정 | 값 |
|---|---|---|
| 둘 다 | `language` | `auto`(시스템 언어), `ko`, `en`, `zh-Hans`, `zh-Hant`, `ja`, `es`, `fr`, `id`, `th` |
| lab-panel | `icons` | `nerd`(파일 종류 아이콘, 기본), `plain`(간단한 글자) |
| lab-panel | `autoOpen` | `true` = 세션 시작할 때 패널 열기 (기본 `false`) |
| lab-panel | `tabsDir` | 메모 탭 폴더. 비우면 `~/.claude/choboza-pack/panel` |

## 아이콘이 네모로 보이나요?

파일 목록은 [Nerd Font](https://www.nerdfonts.com/font-downloads) 아이콘을 씁니다. 아이콘 대신 □ 가 보이면 둘 중 하나:

- Nerd Font 를 설치하고 터미널 글꼴 설정에서 고르기
- `icons` 를 `plain` 으로 바꾸기

## 참고

- 그림판 탭과 CPU·GPU 표시는 윈도우 전용입니다. 나머지는 어디서나 됩니다.
- 한국어·영어 말고는 기계 번역입니다. 고쳐 주시면 반갑습니다.

## 라이선스

[MIT](../LICENSE)
