import { useState, useEffect } from "react";

const RealtimeClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 text-white">
      <p>{time.toLocaleDateString()}</p>
      <h1 className="text-2xl font-semibold">{time.toLocaleTimeString()}</h1>
    </div>
  );
};

export default RealtimeClock;
