import React, { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

export default function StatCounter({ value, suffix = "", title, icon: Icon }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const isStatic = value === "24/7" || !/^\d/.test(value);
  const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const numericValue = match ? parseFloat(match[1]) : 0;
  const parsedSuffix = suffix || (match ? match[2] : "");
  const isDecimal = match && match[1].includes(".");

  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isStatic) return;

    if (isInView) {
      let start = 0;
      const duration = 1800;
      const stepTime = 30;
      const totalSteps = duration / stepTime;
      const increment = numericValue / totalSteps;

      const timer = setInterval(() => {
        start += increment;
        if (start >= numericValue) {
          setCount(numericValue);
          clearInterval(timer);
        } else {
          setCount(isDecimal ? parseFloat(start.toFixed(1)) : Math.floor(start));
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [isInView, numericValue, isStatic, isDecimal]);

  const displayValue = isStatic
    ? value
    : `${isDecimal ? count.toFixed(1) : count}${parsedSuffix}`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="glass-card p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition-all duration-300 group flex flex-col justify-center"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
        {Icon && (
          <div className="p-2 sm:p-3 lg:p-3.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 w-fit shrink-0 group-hover:scale-105 group-hover:bg-cyan-500/20 transition-all duration-300">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold text-white font-mono tracking-tight leading-tight">
            {displayValue}
          </div>
          <div className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5 sm:mt-1 leading-snug">
            {title}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

