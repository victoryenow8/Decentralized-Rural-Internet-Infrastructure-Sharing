import { describe, it, expect, beforeEach } from "vitest"

// Mock implementation for testing Clarity contracts
const mockPrincipal = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockOtherPrincipal = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
const mockBlockHeight = 100

// Mock state
let lastEquipmentId = 0
let lastMaintenanceRecordId = 0
const equipmentRegistry = new Map()
const maintenanceRecords = new Map()
const equipmentOwnershipHistory = new Map()

// Mock contract functions
const registerEquipment = (
    equipmentType,
    model,
    serialNumber,
    manufacturer,
    purchaseDate,
    installationDate,
    locationLatitude,
    locationLongitude,
    locationDescription,
    ipAddress,
    macAddress,
    firmwareVersion,
    powerSource,
    coverageRadiusMeters,
    owner = mockPrincipal,
) => {
  const newId = lastEquipmentId + 1
  lastEquipmentId = newId
  
  equipmentRegistry.set(newId, {
    owner,
    equipmentType,
    model,
    serialNumber,
    manufacturer,
    purchaseDate,
    installationDate,
    locationLatitude,
    locationLongitude,
    locationDescription,
    status: "active",
    ipAddress,
    macAddress,
    firmwareVersion,
    powerSource,
    coverageRadiusMeters,
    registrationDate: mockBlockHeight,
  })
  
  return { value: newId }
}

const getEquipment = (id) => {
  const equipment = equipmentRegistry.get(id)
  if (!equipment) return { error: 404 }
  return { value: equipment }
}

const updateEquipmentStatus = (id, status, owner = mockPrincipal) => {
  const equipment = equipmentRegistry.get(id)
  if (!equipment) return { error: 404 }
  if (equipment.owner !== owner) return { error: 403 }
  
  equipmentRegistry.set(id, {
    ...equipment,
    status,
  })
  
  return { value: id }
}

const updateEquipmentLocation = (
    id,
    locationLatitude,
    locationLongitude,
    locationDescription,
    owner = mockPrincipal,
) => {
  const equipment = equipmentRegistry.get(id)
  if (!equipment) return { error: 404 }
  if (equipment.owner !== owner) return { error: 403 }
  
  equipmentRegistry.set(id, {
    ...equipment,
    locationLatitude,
    locationLongitude,
    locationDescription,
  })
  
  return { value: id }
}

const updateEquipmentNetwork = (id, ipAddress, firmwareVersion, owner = mockPrincipal) => {
  const equipment = equipmentRegistry.get(id)
  if (!equipment) return { error: 404 }
  if (equipment.owner !== owner) return { error: 403 }
  
  equipmentRegistry.set(id, {
    ...equipment,
    ipAddress,
    firmwareVersion,
  })
  
  return { value: id }
}

const transferEquipmentOwnership = (id, newOwner, transferReason, owner = mockPrincipal) => {
  const equipment = equipmentRegistry.get(id)
  if (!equipment) return { error: 404 }
  if (equipment.owner !== owner) return { error: 403 }
  
  const currentOwner = equipment.owner
  
  // Update ownership history
  const changeIndex = lastEquipmentId
  equipmentOwnershipHistory.set(`${id}-${changeIndex}`, {
    previousOwner: currentOwner,
    newOwner,
    transferDate: mockBlockHeight,
    transferReason,
  })
  
  // Update equipment registry
  equipmentRegistry.set(id, {
    ...equipment,
    owner: newOwner,
  })
  
  lastEquipmentId += 1
  
  return { value: id }
}

const addMaintenanceRecord = (
    equipmentId,
    maintenanceType,
    description,
    performedDate,
    cost,
    partsReplaced,
    nextMaintenanceDate,
    performedBy = mockPrincipal,
) => {
  const equipment = equipmentRegistry.get(equipmentId)
  if (!equipment) return { error: 404 }
  
  const newId = lastMaintenanceRecordId + 1
  lastMaintenanceRecordId = newId
  
  maintenanceRecords.set(newId, {
    equipmentId,
    maintenanceType,
    description,
    performedBy,
    performedDate,
    cost,
    partsReplaced,
    nextMaintenanceDate,
  })
  
  return { value: newId }
}

const getMaintenanceRecord = (id) => {
  const record = maintenanceRecords.get(id)
  if (!record) return { error: 404 }
  return { value: record }
}

describe("Equipment Registration Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    lastEquipmentId = 0
    lastMaintenanceRecordId = 0
    equipmentRegistry.clear()
    maintenanceRecords.clear()
    equipmentOwnershipHistory.clear()
  })
  
  describe("Equipment Registration", () => {
    it("should register new equipment", () => {
      const result = registerEquipment(
          "Router",
          "MeshNet Pro 2000",
          "MNP2000-12345",
          "Rural Networks Inc",
          mockBlockHeight - 1000,
          mockBlockHeight - 900,
          "37.7749",
          "-122.4194",
          "Community center rooftop",
          "192.168.1.1",
          "00:1A:2B:3C:4D:5E",
          "v2.3.4",
          "Solar with battery backup",
          5000,
      )
      
      expect(result.value).toBe(1)
      expect(equipmentRegistry.size).toBe(1)
      
      const equipment = getEquipment(1).value
      expect(equipment).not.toBeNull()
      expect(equipment.equipmentType).toBe("Router")
      expect(equipment.model).toBe("MeshNet Pro 2000")
      expect(equipment.status).toBe("active")
      expect(equipment.powerSource).toBe("Solar with battery backup")
      expect(equipment.coverageRadiusMeters).toBe(5000)
    })
    
    it("should register multiple equipment with unique IDs", () => {
      registerEquipment(
          "Router",
          "MeshNet Pro 2000",
          "MNP2000-12345",
          "Rural Networks Inc",
          mockBlockHeight - 1000,
          mockBlockHeight - 900,
          "37.7749",
          "-122.4194",
          "Community center rooftop",
          "192.168.1.1",
          "00:1A:2B:3C:4D:5E",
          "v2.3.4",
          "Solar with battery backup",
          5000,
      )
      
      const result2 = registerEquipment(
          "Access Point",
          "RuralConnect AP-350",
          "RCAP350-67890",
          "Rural Networks Inc",
          mockBlockHeight - 800,
          mockBlockHeight - 750,
          "37.7750",
          "-122.4195",
          "Water tower",
          "192.168.1.2",
          "00:2C:3D:4E:5F:6G",
          "v1.5.2",
          "Grid with solar backup",
          2000,
      )
      
      expect(result2.value).toBe(2)
      expect(equipmentRegistry.size).toBe(2)
      
      const equipment2 = getEquipment(2).value
      expect(equipment2.equipmentType).toBe("Access Point")
      expect(equipment2.model).toBe("RuralConnect AP-350")
    })
  })
  
  describe("Equipment Updates", () => {
    it("should update equipment status", () => {
      registerEquipment(
          "Router",
          "MeshNet Pro 2000",
          "MNP2000-12345",
          "Rural Networks Inc",
          mockBlockHeight - 1000,
          mockBlockHeight - 900,
          "37.7749",
          "-122.4194",
          "Community center rooftop",
          "192.168.1.1",
          "00:1A:2B:3C:4D:5E",
          "v2.3.4",
          "Solar with battery backup",
          5000,
      )
      
      const updateResult = updateEquipmentStatus(1, "maintenance")
      expect(updateResult.value).toBe(1)
      
      const equipment = getEquipment(1).value
      expect(equipment.status).toBe("maintenance")
    })
    
    it("should update equipment location", () => {
      registerEquipment(
          "Router",
          "MeshNet Pro 2000",
          "MNP2000-12345",
          "Rural Networks Inc",
          mockBlockHeight - 1000,
          mockBlockHeight - 900,
          "37.7749",
          "-122.4194",
          "Community center rooftop",
          "192.168.1.1",
          "00:1A:2B:3C:4D:5E",
          "v2.3.4",
          "Solar with battery backup",
          5000,
      )
      
      const updateResult = updateEquipmentLocation(1, "37.7755", "-122.4190", "School building rooftop")
      expect(updateResult.value).toBe(1)
      
      const equipment = getEquipment(1).value
      expect(equipment.locationLatitude).toBe("37.7755")
      expect(equipment.locationLongitude).toBe("-122.4190")
      expect(equipment.locationDescription).toBe("School building rooftop")
    })
    
    it("should update equipment network details", () => {
      registerEquipment(
          "Router",
          "MeshNet Pro 2000",
          "MNP2000-12345",
          "Rural Networks Inc",
          mockBlockHeight - 1000,
          mockBlockHeight - 900,
          "37.7749",
          "-122.4194",
          "Community center rooftop",
          "192.168.1.1",
          "00:1A:2B:3C:4D:5E",
          "v2.3.4",
          "Solar with battery backup",
          5000,
      )
      
      const updateResult = updateEquipmentNetwork(1, "192.168.1.10", "v2.4.0")
      expect(updateResult.value).toBe(1)
      
      const equipment = getEquipment(1).value
      expect(equipment.ipAddress).toBe("192.168.1.10")
      expect(equipment.firmwareVersion).toBe("v2.4.0")
    })
    
    it("should prevent updates by non-owners", () => {
      registerEquipment(
          "Router",
          "MeshNet Pro 2000",
          "MNP2000-12345",
          "Rural Networks Inc",
          mockBlockHeight - 1000,
          mockBlockHeight - 900,
          "37.7749",
          "-122.4194",
          "Community center rooftop",
          "192.168.1.1",
          "00:1A:2B:3C:4D:5E",
          "v2.3.4",
          "Solar with battery backup",
          5000,
      )
      
      const updateResult = updateEquipmentStatus(1, "maintenance", mockOtherPrincipal)
      expect(updateResult.error).toBe(403)
      
      const equipment = getEquipment(1).value
      expect(equipment.status).toBe("active") // Status should not change
    })
  })
  
  describe("Equipment Ownership", () => {
    it("should transfer equipment ownership", () => {
      registerEquipment(
          "Router",
          "MeshNet Pro 2000",
          "MNP2000-12345",
          "Rural Networks Inc",
          mockBlockHeight - 1000,
          mockBlockHeight - 900,
          "37.7749",
          "-122.4194",
          "Community center rooftop",
          "192.168.1.1",
          "00:1A:2B:3C:4D:5E",
          "v2.3.4",
          "Solar with battery backup",
          5000,
      )
      
      const transferResult = transferEquipmentOwnership(1, mockOtherPrincipal, "Equipment donated to school")
      expect(transferResult.value).toBe(1)
      
      const equipment = getEquipment(1).value
      expect(equipment.owner).toBe(mockOtherPrincipal)
      
      // Check ownership history
      const historyEntry = equipmentOwnershipHistory.get(`1-1`)
      expect(historyEntry).not.toBeNull()
      expect(historyEntry.previousOwner).toBe(mockPrincipal)
      expect(historyEntry.newOwner).toBe(mockOtherPrincipal)
      expect(historyEntry.transferReason).toBe("Equipment donated to school")
    })
    
    it("should prevent ownership transfer by non-owners", () => {
      registerEquipment(
          "Router",
          "MeshNet Pro 2000",
          "MNP2000-12345",
          "Rural Networks Inc",
          mockBlockHeight - 1000,
          mockBlockHeight - 900,
          "37.7749",
          "-122.4194",
          "Community center rooftop",
          "192.168.1.1",
          "00:1A:2B:3C:4D:5E",
          "v2.3.4",
          "Solar with battery backup",
          5000,
      )
      
      const transferResult = transferEquipmentOwnership(
          1,
          mockOtherPrincipal,
          "Unauthorized transfer attempt",
          mockOtherPrincipal, // Attempting to transfer as non-owner
      )
      expect(transferResult.error).toBe(403)
      
      const equipment = getEquipment(1).value
      expect(equipment.owner).toBe(mockPrincipal) // Owner should not change
    })
  })
  
  describe("Maintenance Records", () => {
    it("should add maintenance records", () => {
      registerEquipment(
          "Router",
          "MeshNet Pro 2000",
          "MNP2000-12345",
          "Rural Networks Inc",
          mockBlockHeight - 1000,
          mockBlockHeight - 900,
          "37.7749",
          "-122.4194",
          "Community center rooftop",
          "192.168.1.1",
          "00:1A:2B:3C:4D:5E",
          "v2.3.4",
          "Solar with battery backup",
          5000,
      )
      
      const maintenanceResult = addMaintenanceRecord(
          1,
          "Routine Check",
          "Quarterly maintenance and firmware update",
          mockBlockHeight - 500,
          5000, // Cost in cents
          "Antenna cable, weatherproofing seal",
          mockBlockHeight + 1000, // Next maintenance due
      )
      
      expect(maintenanceResult.value).toBe(1)
      expect(maintenanceRecords.size).toBe(1)
      
      const record = getMaintenanceRecord(1).value
      expect(record).not.toBeNull()
      expect(record.equipmentId).toBe(1)
      expect(record.maintenanceType).toBe("Routine Check")
      expect(record.partsReplaced).toBe("Antenna cable, weatherproofing seal")
      expect(record.performedBy).toBe(mockPrincipal)
    })
    
    it("should add multiple maintenance records for the same equipment", () => {
      registerEquipment(
          "Router",
          "MeshNet Pro 2000",
          "MNP2000-12345",
          "Rural Networks Inc",
          mockBlockHeight - 1000,
          mockBlockHeight - 900,
          "37.7749",
          "-122.4194",
          "Community center rooftop",
          "192.168.1.1",
          "00:1A:2B:3C:4D:5E",
          "v2.3.4",
          "Solar with battery backup",
          5000,
      )
      
      addMaintenanceRecord(
          1,
          "Routine Check",
          "Quarterly maintenance and firmware update",
          mockBlockHeight - 500,
          5000,
          "Antenna cable, weatherproofing seal",
          mockBlockHeight + 1000,
      )
      
      const maintenanceResult2 = addMaintenanceRecord(
          1,
          "Emergency Repair",
          "Lightning damage repair",
          mockBlockHeight - 200,
          15000,
          "Lightning arrestor, power supply",
          mockBlockHeight + 800,
      )
      
      expect(maintenanceResult2.value).toBe(2)
      expect(maintenanceRecords.size).toBe(2)
      
      const record2 = getMaintenanceRecord(2).value
      expect(record2.maintenanceType).toBe("Emergency Repair")
      expect(record2.cost).toBe(15000)
    })
    
    it("should prevent adding maintenance records for non-existent equipment", () => {
      const maintenanceResult = addMaintenanceRecord(
          999, // Non-existent equipment ID
          "Routine Check",
          "Quarterly maintenance and firmware update",
          mockBlockHeight - 500,
          5000,
          "Antenna cable, weatherproofing seal",
          mockBlockHeight + 1000,
      )
      
      expect(maintenanceResult.error).toBe(404)
      expect(maintenanceRecords.size).toBe(0)
    })
  })
})

