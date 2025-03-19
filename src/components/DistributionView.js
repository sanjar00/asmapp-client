// src/components/DistributionView.js

import React from 'react';

function DistributionView({ distributions }) {
  return (
    <div>
      <h2>Распределение материалов</h2>
      <table>
        <thead>
          <tr>
            <th>Материал</th>
            <th>Дистрибьютор</th>
            <th>Количество</th>
          </tr>
        </thead>
        <tbody>
          {distributions.map((dist) => (
            <tr key={dist.id}>
              <td>{dist.Material.name}</td>
              <td>{dist.Distributor.name}</td>
              <td>{dist.distributedQuantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DistributionView;
