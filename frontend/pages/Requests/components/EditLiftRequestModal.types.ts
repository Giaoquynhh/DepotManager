import type { ShippingLine, TransportCompany, ContainerType, Customer } from '../../../services/setupService';

export interface EditLiftRequestModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: EditLiftRequestData) => void;
	requestData: any;
}

export interface EditLiftRequestData {
	requestNo: string;
	shippingLine: string;
	bookingBill: string;
	containerNumber?: string;
	containerType: string;
	serviceType: string;
	customer: string;
	vehicleCompany?: string;
	vehicleNumber?: string;
	driver?: string;
	driverPhone?: string;
	appointmentTime?: string;
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


