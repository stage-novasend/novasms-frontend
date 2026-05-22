import { useEffect } from 'react';

async function loadCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
  await new Promise((res) => {
    link.onload = () => res(null);
    link.onerror = () => res(null);
  });
}

async function loadScript(src: string): Promise<void> {
  if (document.querySelector(`script[src="${src}"]`)) return;
  await new Promise<void>((resolve) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
}

export default function DriverTour({
  run,
  steps,
  onClose,
}: {
  run: boolean;
  steps: Array<{
    element: string;
    popover: { title?: string; description: string; position?: string };
  }>;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!run) return;

    let activeDriver: any = null;

    (async () => {
      await loadCss('https://unpkg.com/driver.js@1.7.0/dist/driver.min.css');
      await loadScript('https://unpkg.com/driver.js@1.7.0/dist/driver.min.js');

      const driverGlobal = window as Window & {
        Driver?: new (options: {
          allowClose: boolean;
          showButtons: boolean;
          showProgress: boolean;
        }) => {
          defineSteps: (
            stepsList: Array<{
              element: string;
              popover: { title?: string; description: string; position?: string };
            }>,
          ) => void;
          start: () => void;
          on: (eventName: string, handler: () => void) => void;
          reset: () => void;
        };
        driver?: new (options: {
          allowClose: boolean;
          showButtons: boolean;
          showProgress: boolean;
        }) => {
          defineSteps: (
            stepsList: Array<{
              element: string;
              popover: { title?: string; description: string; position?: string };
            }>,
          ) => void;
          start: () => void;
          on: (eventName: string, handler: () => void) => void;
          reset: () => void;
        };
      };

      const DriverLib = driverGlobal.Driver || driverGlobal.driver;

      if (!DriverLib) {
        console.warn('Driver.js not available');
        onClose();
        return;
      }

      const driver = new DriverLib({ allowClose: true, showButtons: true, showProgress: true });
      activeDriver = driver;

      const drvSteps = steps.map((s) => ({
        element: s.element,
        popover: {
          title: s.popover.title || '',
          description: s.popover.description,
          position: s.popover.position || 'right',
        },
      }));
      try {
        driver.defineSteps(drvSteps);
        driver.start();
      } catch (e) {
        console.warn('driver start failed', e);
        onClose();
      }

      driver.on('reset', () => onClose());
      driver.on('complete', () => onClose());
    })();

    return () => {
      try {
        if (activeDriver) activeDriver.reset();
      } catch (e) {
        // noop
      }
    };
  }, [run, steps, onClose]);

  return null;
}
