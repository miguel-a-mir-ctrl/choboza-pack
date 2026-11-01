export type Limit = { kind: string; percentUsed: number; resetsAt?: string }
// -1 = 그 장치가 없거나 못 읽음
export type Sys = { cpu: number; ram: number; ramGb: number; gpu: number; npu: number; gpuApprox?: boolean }
// 지금 모델·effort·문맥. effort 는 첫 요청 전엔 없음
export type Info = { model: string; effort?: string; tokens?: number; window: number; percent?: number }

// 세션 정리 표시: 커밋하면 off, 파일을 고치면 다시 on. pending = Claude 가 `: pending N` 으로 남긴 할 일 수
export type Mark = { off: boolean; pending: number }

// context advice state: doneAt = last turn end (ms), idleBack = came back after >1h idle with >=100k,
// told = advice kind already sent to the model (notify only when it changes), open = explanation row shown
export type Act = { doneAt: number; idleBack: boolean; told: string | null; open: boolean }

declare module 'claude-code' {
  interface PluginState {
    'usage-line': { limits: Limit[] | null; sys: Sys | null; info: Info | null; mark: Mark | null; act: Act | null; frame: number | null }
  }
}
