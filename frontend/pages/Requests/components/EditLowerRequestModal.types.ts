import type { ShippingLine, TransportCompany, ContainerType, Customer } from '../../../services/setupService';

export interface EditLowerRequestModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: EditLowerRequestData) => void;
	requestData: any;
}

export interface EditLowerRequestData {
	requestNo: string;
	shippingLine: string;
	containerNumber?: string;
	containerType: string;
	serviceType: string;
	customer: string;
	vehicleCompany?: string;
	vehicleNumber?: string;
	driver?: string;
	driverPhone?: string;
	appointmentTime?: string;
	demDet?: string; // DEM/DET field
	documents?: File[];
	notes?: string;
}

export type ExistingFile = {
	id: string;
	file_name: string;
	file_size: number;
	storage_url: string;
	file_type: string;
};

export type DropdownData = {
	shippingLines: ShippingLine[];
	transportCompanies: TransportCompany[];
	containerTypes: ContainerType[];
	customers: Customer[];
};
