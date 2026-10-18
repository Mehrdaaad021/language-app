-- CreateIndex
CREATE INDEX "Note_studentId_date_idx" ON "Note"("studentId", "date");

-- CreateIndex
CREATE INDEX "Payment_studentId_date_idx" ON "Payment"("studentId", "date");

-- CreateIndex
CREATE INDEX "Session_studentId_date_idx" ON "Session"("studentId", "date");

-- CreateIndex
CREATE INDEX "Student_name_idx" ON "Student"("name");
