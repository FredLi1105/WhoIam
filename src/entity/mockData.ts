export interface ProjectData {
  name: string;
  description: string;
  component: [ProjectComponent];
}

interface ProjectComponent {
  name: string;
  description: string;
  technology: [string];
}
