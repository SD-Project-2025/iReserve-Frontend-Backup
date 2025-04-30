import { ButtonGroup, Button } from "@mui/material";

interface ActionButtonsProps {
  onView: () => void;
  onCancel?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  cancelDisabled?: boolean;
}

const ActionButtons = ({ 
  onView, 
  onCancel, 
  onAction, 
  actionLabel, 
  cancelDisabled 
}: ActionButtonsProps) => (
  <ButtonGroup size="small" variant="outlined">
    <Button color="primary" onClick={onView}>View</Button>
    {onCancel && (
      <Button 
        color="error" 
        onClick={onCancel}
        disabled={cancelDisabled}
      >
        Cancel
      </Button>
    )}
    {onAction && (
      <Button color="success" onClick={onAction}>
        {actionLabel || "Action"}
      </Button>
    )}
  </ButtonGroup>
);

export default ActionButtons;