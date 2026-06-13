'use client'

import { forwardRef } from 'react'
import BaseReplyForm, { type ReplyFormHandle } from '../ReplyForm'

export type { ReplyFormHandle }

interface Props {
  topicId: string
  isLocked: boolean
  onPosted?: () => void
}

// Thread-local compose-reply concern. The actual editor + createPost call live
// in the shared `../ReplyForm`; this thin wrapper co-locates the concern with
// the rest of the thread's children and forwards the imperative handle the
// parent uses to focus the editor and prepend quotes. No duplication of the
// form itself — see CLAUDE.md "don't extract prematurely / rule of three".
const ReplyForm = forwardRef<ReplyFormHandle, Props>(function ReplyForm(props, ref) {
  return <BaseReplyForm ref={ref} {...props} />
})

export default ReplyForm
