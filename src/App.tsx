/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainDisplay from './components/MainDisplay';
import RemoteControl from './components/RemoteControl';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainDisplay />} />
        <Route path="/remote" element={<RemoteControl />} />
      </Routes>
    </Router>
  );
}
