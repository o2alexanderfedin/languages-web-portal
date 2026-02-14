import { useNavigate } from 'react-router';
import { TOOLS } from '@repo/shared';
import { Button, type ButtonProps } from '@/components/ui/button';

interface QuickStartCTAProps {
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}

export function QuickStartCTA({ variant = 'default', size = 'default', className }: QuickStartCTAProps) {
  const navigate = useNavigate();

  const firstTryableTool = TOOLS.find((tool) => tool.status !== 'coming-soon');

  const handleClick = () => {
    if (firstTryableTool) {
      navigate(`/demo?tool=${firstTryableTool.id}&quickstart=true`);
    }
  };

  if (!firstTryableTool) {
    return null;
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick} data-testid="quickstart-cta">
      Try {firstTryableTool.name} Now
    </Button>
  );
}
