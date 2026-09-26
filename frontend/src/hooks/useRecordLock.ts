import { useCallback, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

// Başka bir kullanıcının düzenlemekte olduğu kayıtları takip eder ve
// düzenleme başlarken/biterken kilit anonslarını yayınlar.
export const useRecordLock = (
  socket: Socket,
  tenantId?: string,
  userEmail?: string,
) => {
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
      if (!tenantId) return;
      socket.emit("lock_record", {
        tenantId,
        recordId,
        userEmail: userEmail || "Staff",
      });
    },
    [socket, tenantId, userEmail],
  );

  const unlockRecord = useCallback(
    (recordId?: string) => {
      if (!recordId || !tenantId) return;
      socket.emit("unlock_record", { tenantId, recordId });
    },
    [socket, tenantId],
  );

  return { isLocked, lockRecord, unlockRecord };
};
