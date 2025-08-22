<ul className="space-y-6">
  {listings.map((l, idx) => (
    <li key={idx} className="border rounded-xl p-5 shadow-sm">
      <h2 className="text-xl font-semibold">
        {l.externalUrl ? (
          <a
            href={l.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {l.header ?? 'Untitled Listing'}
          </a>
        ) : (
          l.header ?? 'Untitled Listing'
        )}
      </h2>

      <p className="text-gray-600">{l.location ?? 'Unknown location'}</p>

      <div className="mt-2 space-y-1 text-sm">
        {l.price != null && (
          <p>💰 Asking Price: ${Number(l.price).toLocaleString()}</p>
        )}
        {l.cashFlow && !Number.isNaN(Number(l.cashFlow)) && (
          <p>💵 Cash Flow: ${Number(l.cashFlow).toLocaleString()}</p>
        )}
        {l.ebitda && !Number.isNaN(Number(l.ebitda)) && (
          <p>📈 EBITDA: ${Number(l.ebitda).toLocaleString()}</p>
        )}
      </div>

      {(l.brokerContactFullName || l.brokerCompany) && (
        <p className="mt-3 text-sm text-gray-700">
          Broker:{' '}
          <strong>
            {l.brokerContactFullName ?? 'Unknown'}
            {l.brokerCompany ? ` (${l.brokerCompany})` : ''}
          </strong>
        </p>
      )}
    </li>
  ))}
</ul>
