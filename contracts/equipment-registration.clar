;; Equipment Registration Contract
;; Records details of community network components

;; Define data variables
(define-data-var last-equipment-id uint u0)
(define-data-var last-maintenance-record-id uint u0)

;; Map to store equipment details
(define-map equipment-registry
{ id: uint }
{
  owner: principal,
  equipment-type: (string-ascii 50),
  model: (string-ascii 100),
  serial-number: (string-ascii 100),
  manufacturer: (string-ascii 100),
  purchase-date: uint,
  installation-date: uint,
  location-latitude: (string-ascii 20),
  location-longitude: (string-ascii 20),
  location-description: (string-ascii 200),
  status: (string-ascii 20),
  ip-address: (string-ascii 50),
  mac-address: (string-ascii 50),
  firmware-version: (string-ascii 50),
  power-source: (string-ascii 50),
  coverage-radius-meters: uint,
  registration-date: uint
}
)

;; Map to store equipment maintenance records
(define-map maintenance-records
{ id: uint }
{
  equipment-id: uint,
  maintenance-type: (string-ascii 50),
  description: (string-ascii 500),
  performed-by: principal,
  performed-date: uint,
  cost: uint,
  parts-replaced: (string-ascii 200),
  next-maintenance-date: uint
}
)

;; Map to track equipment ownership history
(define-map equipment-ownership-history
{ equipment-id: uint, change-index: uint }
{
  previous-owner: principal,
  new-owner: principal,
  transfer-date: uint,
  transfer-reason: (string-ascii 200)
}
)

;; Get the last assigned equipment ID
(define-read-only (get-last-equipment-id)
  (ok (var-get last-equipment-id))
)

;; Get equipment details by ID
(define-read-only (get-equipment (id uint))
  (match (map-get? equipment-registry { id: id })
    equipment (ok equipment)
    (err u404)
  )
)

;; Register new equipment
(define-public (register-equipment
  (equipment-type (string-ascii 50))
  (model (string-ascii 100))
  (serial-number (string-ascii 100))
  (manufacturer (string-ascii 100))
  (purchase-date uint)
  (installation-date uint)
  (location-latitude (string-ascii 20))
  (location-longitude (string-ascii 20))
  (location-description (string-ascii 200))
  (ip-address (string-ascii 50))
  (mac-address (string-ascii 50))
  (firmware-version (string-ascii 50))
  (power-source (string-ascii 50))
  (coverage-radius-meters uint))
  (let
    ((new-id (+ (var-get last-equipment-id) u1)))
    (var-set last-equipment-id new-id)
    (map-set equipment-registry { id: new-id } {
      owner: tx-sender,
      equipment-type: equipment-type,
      model: model,
      serial-number: serial-number,
      manufacturer: manufacturer,
      purchase-date: purchase-date,
      installation-date: installation-date,
      location-latitude: location-latitude,
      location-longitude: location-longitude,
      location-description: location-description,
      status: "active",
      ip-address: ip-address,
      mac-address: mac-address,
      firmware-version: firmware-version,
      power-source: power-source,
      coverage-radius-meters: coverage-radius-meters,
      registration-date: block-height
    })
    (ok new-id)
  )
)

;; Update equipment status
(define-public (update-equipment-status
  (id uint)
  (status (string-ascii 20)))
  (let ((equipment-data (map-get? equipment-registry { id: id })))
    (match equipment-data
      equipment (if (is-eq tx-sender (get owner equipment))
        (begin
          (map-set equipment-registry { id: id }
            (merge equipment { status: status })
          )
          (ok id)
        )
        (err u403))
      (err u404)
    )
  )
)

;; Update equipment location
(define-public (update-equipment-location
  (id uint)
  (location-latitude (string-ascii 20))
  (location-longitude (string-ascii 20))
  (location-description (string-ascii 200)))
  (let ((equipment-data (map-get? equipment-registry { id: id })))
    (match equipment-data
      equipment (if (is-eq tx-sender (get owner equipment))
        (begin
          (map-set equipment-registry { id: id }
            (merge equipment {
              location-latitude: location-latitude,
              location-longitude: location-longitude,
              location-description: location-description
            })
          )
          (ok id)
        )
        (err u403))
      (err u404)
    )
  )
)

;; Update equipment network details
(define-public (update-equipment-network
  (id uint)
  (ip-address (string-ascii 50))
  (firmware-version (string-ascii 50)))
  (let ((equipment-data (map-get? equipment-registry { id: id })))
    (match equipment-data
      equipment (if (is-eq tx-sender (get owner equipment))
        (begin
          (map-set equipment-registry { id: id }
            (merge equipment {
              ip-address: ip-address,
              firmware-version: firmware-version
            })
          )
          (ok id)
        )
        (err u403))
      (err u404)
    )
  )
)

;; Transfer equipment ownership
(define-public (transfer-equipment-ownership
  (id uint)
  (new-owner principal)
  (transfer-reason (string-ascii 200)))
  (let ((equipment-data (map-get? equipment-registry { id: id })))
    (match equipment-data
      equipment (if (is-eq tx-sender (get owner equipment))
        (let ((current-owner (get owner equipment)))
          ;; Update ownership history
          (map-set equipment-ownership-history
            { equipment-id: id, change-index: (var-get last-equipment-id) }
            {
              previous-owner: current-owner,
              new-owner: new-owner,
              transfer-date: block-height,
              transfer-reason: transfer-reason
            }
          )
          ;; Update equipment registry with new owner
          (map-set equipment-registry { id: id }
            (merge equipment { owner: new-owner })
          )
          (var-set last-equipment-id (+ (var-get last-equipment-id) u1))
          (ok id)
        )
        (err u403))
      (err u404)
    )
  )
)

;; Add maintenance record
(define-public (add-maintenance-record
  (equipment-id uint)
  (maintenance-type (string-ascii 50))
  (description (string-ascii 500))
  (performed-date uint)
  (cost uint)
  (parts-replaced (string-ascii 200))
  (next-maintenance-date uint))
  (let ((equipment-data (map-get? equipment-registry { id: equipment-id })))
    (match equipment-data
      equipment
      (let ((new-id (+ (var-get last-maintenance-record-id) u1)))
        (var-set last-maintenance-record-id new-id)
        (map-set maintenance-records { id: new-id } {
          equipment-id: equipment-id,
          maintenance-type: maintenance-type,
          description: description,
          performed-by: tx-sender,
          performed-date: performed-date,
          cost: cost,
          parts-replaced: parts-replaced,
          next-maintenance-date: next-maintenance-date
        })
        (ok new-id)
      )
      (err u404)
    )
  )
)

;; Get maintenance record by ID
(define-read-only (get-maintenance-record (id uint))
  (match (map-get? maintenance-records { id: id })
    record (ok record)
    (err u404)
  )
)

;; Get equipment by type
(define-read-only (get-equipment-by-type (equipment-type (string-ascii 50)))
  ;; In a real implementation, this would filter equipment by type
  ;; For simplicity, we return a placeholder
  (ok (list))
)

;; Get equipment by owner
(define-read-only (get-equipment-by-owner (owner principal))
  ;; In a real implementation, this would filter equipment by owner
  ;; For simplicity, we return a placeholder
  (ok (list))
)

;; Get equipment by status
(define-read-only (get-equipment-by-status (status (string-ascii 20)))
  ;; In a real implementation, this would filter equipment by status
  ;; For simplicity, we return a placeholder
  (ok (list))
)

;; Get maintenance records for equipment
(define-read-only (get-maintenance-records-for-equipment (equipment-id uint))
  ;; In a real implementation, this would filter maintenance records by equipment-id
  ;; For simplicity, we return a placeholder
  (ok (list))
)

