'use client';

import { type ReactNode } from 'react';
import { Tabs, TabList, TabTrigger, TabPanel } from '@/components/ui/tabs';

interface SessionsTabsClientProps {
  upcomingContent: ReactNode;
  pastContent: ReactNode;
}

export function SessionsTabsClient({ upcomingContent, pastContent }: SessionsTabsClientProps) {
  return (
    <Tabs defaultValue="upcoming">
      <TabList>
        <TabTrigger value="upcoming">Upcoming</TabTrigger>
        <TabTrigger value="past">Past</TabTrigger>
      </TabList>
      <TabPanel value="upcoming">{upcomingContent}</TabPanel>
      <TabPanel value="past">{pastContent}</TabPanel>
    </Tabs>
  );
}
