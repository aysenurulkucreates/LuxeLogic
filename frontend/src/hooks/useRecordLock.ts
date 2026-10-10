import { useCallback, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

// Başka bir kullanıcının düzenlemekte olduğu kayıtları takip eder ve
// düzenleme başlarken/biterken kilit anonslarını yayınlar.
export const useRecordLock = (socket: Socket) => {
  const [lockedRecords, setLockedRecords] = useState<string[]>([]);

  useEffect(() => {
    const handleLocked = ({ recordId }: { recordId: string }) => {
      setLockedRecords((prev) => [...prev, recordId]);
    };
    const handleUnlocked = ({ recordId }: { recordId: string }) => {
      setLockedRecords((prev) => prev.filter((id) => id !== recordId));
    };

    socket.on("record_locked", handleLocked);
    socket.on("record_unlocked", handleUnlocked);

    return () => {
      socket.off("record_locked", handleLocked);
      socket.off("record_unlocked", handleUnlocked);
    };
  }, [socket]);

  const isLocked = useCallback(
    (recordId: string) => lockedRecords.includes(recordId),
    [lockedRecords],
  );

  const lockRecord = useCallback(
    (recordId: string) => {
      socket.emit("lock_record", { recordId });
    },
    [socket],
  );

  const unlockRecord = useCallback(
    (recordId?: string) => {
      if (!recordId) return;
      socket.emit("unlock_record", { recordId });
    },
    [socket],
  );

  return { isLocked, lockRecord, unlockRecord };
};
