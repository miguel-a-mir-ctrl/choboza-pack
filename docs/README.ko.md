[English](../README.md) · [한국어](README.ko.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md)

# choboza-pack (초보자팩)

초보자를 위한 Claude Code 작은 모드 두 개입니다. 내 PC 안에서 돌아가는 코드입니다.

## 들어 있는 것

| 모드 | 하는 일 |
|---|---|
| **usage-line** | 입력칸 위에 한 줄: 5시간·주간 사용량, 지금 모델·effort·문맥. CPU·RAM·GPU 사용률도 보이고, 시스템이 알려 주면 NPU 도 보입니다. |
| **lab-panel** | 옆 패널에 알록달록한 파일 목록. Claude 가 읽거나 고친 파일이 잠깐 빛납니다. 다시보기 탭은 방금 턴에서 고친 내용을 보여 줍니다. 메모 탭에 내 메모를 둘 수 있습니다. 그림판 탭에서 표시를 그려 Claude 에게 보낼 수 있습니다 (윈도우에서는 클립보드 그림 위에도). |

## 설치

Claude Code 에서 입력하세요:

```
/plugin marketplace add miguel-a-mir-ctrl/choboza-pack
/plugin install usage-line@choboza-pack
/plugin install lab-panel@choboza-pack
```

그다음 Claude Code 를 다시 켜세요 (또는 `/reload-plugins`). 패널은 `/panel` 로 열거나, 입력칸 위 `[패널]` 을 누르면 됩니다 (Claude 가 일하는 중에도 열림).

## 설정

플러그인 설정(`/plugin`)에서 바꿉니다.

| 모드 | 설정 | 값 |
|---|---|---|
| 둘 다 | `language` | `auto`(시스템 언어), `ko`, `en`, `zh-Hans`, `zh-Hant`, `ja`, `es`, `fr`, `id`, `th` |
| usage-line | `gpu` | `auto`(가장 바쁜 GPU, 기본), `nvidia`, `amd`, `intel`, `off` |
| lab-panel | `icons` | `nerd`(파일 종류 아이콘, 기본), `plain`(간단한 글자) |
| lab-panel | `autoOpen` | `true` = 세션 시작할 때 패널 열기 (기본 `false`) |
| lab-panel | `tabsDir` | 메모 탭 폴더. 비우면 `~/.claude/choboza-pack/panel` |

## 아이콘이 네모로 보이나요?

파일 목록은 [Nerd Font](https://www.nerdfonts.com/font-downloads) 아이콘을 씁니다. 아이콘 대신 □ 가 보이면 둘 중 하나:

- Nerd Font 를 설치하고 터미널 글꼴 설정에서 고르기
- `icons` 를 `plain` 으로 바꾸기

## 참고

- 토큰은 거의 0: 모드는 내 PC 에서 돌고 Claude 가 읽는 내용에 아무것도 더하지 않습니다. 예외는 문맥이 100k 를 넘을 때 `/compact` 나 새 세션을 권하는 짧은 메모(약 20 토큰)뿐입니다. 2026-11-01 측정: 팩을 켜도 꺼도 입력 토큰이 같았습니다 (실행마다 생기는 보통 오차 안).
- 주로 윈도우에서 시험했습니다. 리눅스·맥도 되지만 덜 시험했습니다 (맥 표시에는 NPU 가 없음).
- 한국어·영어 말고는 기계 번역입니다. 고쳐 주시면 반갑습니다.

## 라이선스

[MIT](../LICENSE)
