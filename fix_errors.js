const fs = require('fs');

// 1. Fix YouTubeTasksAdmin.tsx imports
let ytAdmin = fs.readFileSync('src/components/YouTubeTasksAdmin.tsx', 'utf8');
ytAdmin = ytAdmin.replace(/import \{ Clock, Eye, CheckCircle2, XCircle, ShieldAlert, Search, Filter, CheckCircle, motion, AnimatePresence \} from "framer-motion";/g, 'import { motion, AnimatePresence } from "framer-motion";');
ytAdmin = ytAdmin.replace(/import \{ Clock, Eye, CheckCircle2, XCircle, ShieldAlert, Search, Filter, CheckCircle, useState, useEffect, useRef \} from "react";/g, 'import { useState, useEffect, useRef } from "react";');

// It's possible I matched something else. Let's just fix it manually.
