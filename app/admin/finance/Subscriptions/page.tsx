import React from 'react';
import AddNew from './AddNew';
import SubscriptionPlan from './SubscriptionPlans/page';

const Subscriptions = () => {
  return (
    <div className="flex flex-col bg-white rounded-lg mt-2 max-h-[100vw]">
      <div className="w-full flex items-center p-2">
        <div className="flex ml-auto">
          <AddNew />
        </div>
      </div>
      <div className="w-full pb-3">
        <SubscriptionPlan />
      </div>
    </div>
  );
};

export default Subscriptions;