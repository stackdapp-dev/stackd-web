"use client";

import PageHeader from "@/components/common/PageHeader";

const AddPayMethod = () => {
  return (
    <div className="p-6 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)] flex flex-col gap-8">
      <PageHeader title="Add a Payment Method" />
    </div>
  );
};

export default AddPayMethod;
