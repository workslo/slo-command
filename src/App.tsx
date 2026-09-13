/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { ImageGenWorkspace } from './components/ImageGenWorkspace';
import { ImageEditWorkspace } from './components/ImageEditWorkspace';
import { NexusWorkspace } from './components/NexusWorkspace';
import { AtlasWorkspace } from './components/AtlasWorkspace';
import { ArchiveWorkspace } from './components/ArchiveWorkspace';
import { JournalWorkspace } from './components/JournalWorkspace';
import { PromptsWorkspace } from './components/PromptsWorkspace';
import { AppMode } from './types';

export default function App() {
  const [mode, setMode] = useState<AppMode>('chat');

  return (
    <div className="flex h-screen bg-[#111619] overflow-hidden font-sans selection:bg-[#D89A3A]/30">
      <Sidebar currentMode={mode} onModeChange={setMode} />
      <main className="flex-1 min-w-0 relative">
        {mode === 'chat' && <ChatWorkspace />}
        {mode === 'image-gen' && <ImageGenWorkspace />}
        {mode === 'image-edit' && <ImageEditWorkspace />}
        {mode === 'search' && <NexusWorkspace />}
        {mode === 'maps' && <AtlasWorkspace />}
        {mode === 'archive' && <ArchiveWorkspace />}
        {mode === 'journal' && <JournalWorkspace />}
        {mode === 'prompts' && <PromptsWorkspace />}
      </main>
    </div>
  );
}
