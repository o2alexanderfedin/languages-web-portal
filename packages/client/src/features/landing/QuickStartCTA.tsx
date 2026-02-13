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

  const firstAvailableTool = TOOLS.find((tool) => tool.status === 'available');

  const handleClick = () => {
    if (firstAvailableTool) {
      navigate(`/demo?tool=${firstAvailableTool.id}&quickstart=true`);
    }
  };

  if (!firstAvailableTool) {
    return null;
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick}>
      Try {firstAvailableTool.name} Now
    </Button>
  );
}
