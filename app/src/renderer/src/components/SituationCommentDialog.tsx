import { type Situation } from '../situations'
import Dialog from './Dialog'

type SituationCommentDialogProps = {
  situation: Situation
  onClose: () => void
}

function SituationCommentDialog({
  situation,
  onClose
}: SituationCommentDialogProps): React.JSX.Element {
  return (
    <Dialog titleId="comment-dialog-title" onClose={onClose}>
      <h2 id="comment-dialog-title" className="comment-dialog-title">
        {situation.title}
      </h2>
      <p className="comment-dialog-text">{situation.comment}</p>
    </Dialog>
  )
}

export default SituationCommentDialog
