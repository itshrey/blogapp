import React from 'react';
import { Spinner } from 'flowbite-react';

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Spinner size="xl" />
    </div>
  );
}